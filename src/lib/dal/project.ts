import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  isNull,
  sql,
} from 'drizzle-orm';
import { opportunities, projects, signUps } from '@/db/schema';
import type { ProjectFormOutput } from '../schemas/project-form';
import { mockDelay } from '../utils/mockDelay';
import { withTenantContext } from './withTenantContext';

export type ProjectListItem = Awaited<
  ReturnType<typeof findProjectsByTenant>
>[number];

export type ProjectWithDetails = NonNullable<
  Awaited<ReturnType<typeof findProjectById>>
>;

export type PublishedProject = Awaited<
  ReturnType<typeof findPublishedProjects>
>[number];

export type MoveOpportunityResult =
  | { ok: true }
  | { ok: false; reason: 'project-not-found' | 'opportunity-not-found' };

export type AssignOpportunityResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'project-not-found'
        | 'opportunity-not-found'
        | 'in-other-project';
    };

const liveProject = (projectId: string, tenantId: string) =>
  and(
    eq(projects.id, projectId),
    eq(projects.tenantId, tenantId),
    isNull(projects.deletedAt),
  );

const projectOpportunity = and(
  eq(opportunities.projectId, projects.id),
  isNull(opportunities.deletedAt),
);

export async function findProjectsByTenant(tenantId: string) {
  await mockDelay();

  return withTenantContext(tenantId, (tx) =>
    tx
      .select({
        ...getTableColumns(projects),
        opportunityCount: count(opportunities.id),
        firstStart: sql<Date | null>`min(${opportunities.startTime})`.mapWith(
          opportunities.startTime,
        ),
        lastEnd: sql<Date | null>`max(${opportunities.endTime})`.mapWith(
          opportunities.endTime,
        ),
      })
      .from(projects)
      .leftJoin(opportunities, projectOpportunity)
      .where(and(eq(projects.tenantId, tenantId), isNull(projects.deletedAt)))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt)),
  );
}

export async function findProjectById(projectId: string, tenantId: string) {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const project = await tx.query.projects.findFirst({
      where: liveProject(projectId, tenantId),
      with: {
        creator: { columns: { firstName: true, lastName: true } },
        updater: { columns: { firstName: true, lastName: true } },
      },
    });

    if (!project) return null;

    const projectOpportunities = await tx
      .select({
        id: opportunities.id,
        title: opportunities.title,
        opportunityType: opportunities.opportunityType,
        startTime: opportunities.startTime,
        endTime: opportunities.endTime,
        timeZone: opportunities.timeZone,
        isPublished: opportunities.isPublished,
        maxSignupsAllowed: opportunities.maxSignupsAllowed,
        signupCount: count(signUps.id),
      })
      .from(opportunities)
      .leftJoin(
        signUps,
        and(
          eq(signUps.opportunityId, opportunities.id),
          isNull(signUps.deletedAt),
        ),
      )
      .where(
        and(
          eq(opportunities.projectId, projectId),
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
        ),
      )
      .groupBy(opportunities.id)
      .orderBy(asc(opportunities.startTime));

    return { ...project, opportunities: projectOpportunities };
  });
}

// Opportunities that aren't in any project yet, offered when adding one to a
// project. An opportunity belongs to at most one project.
export async function findUnassignedOpportunities(tenantId: string) {
  await mockDelay();

  return withTenantContext(tenantId, (tx) =>
    tx
      .select({
        id: opportunities.id,
        title: opportunities.title,
        startTime: opportunities.startTime,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
          isNull(opportunities.projectId),
        ),
      )
      .orderBy(desc(opportunities.startTime)),
  );
}

export async function createProject(
  tenantId: string,
  userId: string,
  data: ProjectFormOutput,
) {
  await mockDelay();

  const [created] = await withTenantContext(tenantId, (tx) =>
    tx
      .insert(projects)
      .values({ ...data, tenantId, createdBy: userId })
      .returning({ id: projects.id }),
  );

  return created.id;
}

export async function updateProject(
  projectId: string,
  tenantId: string,
  userId: string,
  data: ProjectFormOutput,
) {
  await mockDelay();

  const [updated] = await withTenantContext(tenantId, (tx) =>
    tx
      .update(projects)
      .set({ ...data, updatedBy: userId })
      .where(liveProject(projectId, tenantId))
      .returning({ id: projects.id }),
  );

  return updated?.id ?? null;
}

export async function toggleProjectPublish(
  projectId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  const [updated] = await withTenantContext(tenantId, (tx) =>
    tx
      .update(projects)
      .set({ isPublished: sql`NOT ${projects.isPublished}`, updatedBy: userId })
      .where(liveProject(projectId, tenantId))
      .returning({ id: projects.id }),
  );

  return updated !== undefined;
}

// Deleting a project leaves its opportunities in place, just ungrouped.
export async function deleteProject(
  projectId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const [deleted] = await tx
      .update(projects)
      .set({ deletedAt: new Date(), deletedBy: userId })
      .where(liveProject(projectId, tenantId))
      .returning({ id: projects.id });

    if (!deleted) return false;

    await tx
      .update(opportunities)
      .set({ projectId: null, updatedBy: userId })
      .where(
        and(
          eq(opportunities.projectId, projectId),
          eq(opportunities.tenantId, tenantId),
        ),
      );

    return true;
  });
}

export async function assignOpportunityToProject(
  oppId: string,
  projectId: string,
  tenantId: string,
  userId: string,
): Promise<AssignOpportunityResult> {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    const [project] = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(liveProject(projectId, tenantId));

    if (!project) return { ok: false, reason: 'project-not-found' };

    const [opportunity] = await tx
      .select({ projectId: opportunities.projectId })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.id, oppId),
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
        ),
      )
      .for('update');

    if (!opportunity) return { ok: false, reason: 'opportunity-not-found' };

    if (opportunity.projectId && opportunity.projectId !== projectId) {
      return { ok: false, reason: 'in-other-project' };
    }

    await tx
      .update(opportunities)
      .set({ projectId: project.id, updatedBy: userId })
      .where(eq(opportunities.id, oppId));

    return { ok: true };
  });
}

export async function removeOpportunityFromProject(
  oppId: string,
  projectId: string,
  tenantId: string,
  userId: string,
) {
  await mockDelay();

  const [updated] = await withTenantContext(tenantId, (tx) =>
    tx
      .update(opportunities)
      .set({ projectId: null, updatedBy: userId })
      .where(
        and(
          eq(opportunities.id, oppId),
          eq(opportunities.projectId, projectId),
          eq(opportunities.tenantId, tenantId),
        ),
      )
      .returning({ id: opportunities.id }),
  );

  return updated !== undefined;
}

// Sets an opportunity's project from the opportunity's own page, where moving
// it between projects is an explicit choice. Passing null ungroups it.
export async function moveOpportunityToProject(
  oppId: string,
  projectId: string | null,
  tenantId: string,
  userId: string,
): Promise<MoveOpportunityResult> {
  await mockDelay();

  return withTenantContext(tenantId, async (tx) => {
    if (projectId !== null) {
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(liveProject(projectId, tenantId));

      if (!project) return { ok: false, reason: 'project-not-found' };
    }

    const [updated] = await tx
      .update(opportunities)
      .set({ projectId, updatedBy: userId })
      .where(
        and(
          eq(opportunities.id, oppId),
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
        ),
      )
      .returning({ id: opportunities.id });

    if (!updated) return { ok: false, reason: 'opportunity-not-found' };

    return { ok: true };
  });
}

// Published projects with at least one upcoming published opportunity,
// soonest first. Projects with nothing left to join drop off the list.
export async function findPublishedProjects(tenantId: string) {
  await mockDelay();

  const now = new Date();

  return withTenantContext(tenantId, (tx) =>
    tx
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        upcomingCount: count(opportunities.id),
        nextStart: sql<Date>`min(${opportunities.startTime})`.mapWith(
          opportunities.startTime,
        ),
        lastEnd: sql<Date>`max(${opportunities.endTime})`.mapWith(
          opportunities.endTime,
        ),
      })
      .from(projects)
      .innerJoin(
        opportunities,
        and(
          projectOpportunity,
          eq(opportunities.isPublished, true),
          gt(opportunities.startTime, now),
        ),
      )
      .where(
        and(
          eq(projects.tenantId, tenantId),
          eq(projects.isPublished, true),
          isNull(projects.deletedAt),
        ),
      )
      .groupBy(projects.id)
      .orderBy(asc(sql`min(${opportunities.startTime})`)),
  );
}

export async function findPublishedProjectById(
  projectId: string,
  tenantId: string,
) {
  await mockDelay();

  const [project] = await withTenantContext(tenantId, (tx) =>
    tx
      .select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
      })
      .from(projects)
      .where(
        and(liveProject(projectId, tenantId), eq(projects.isPublished, true)),
      ),
  );

  return project ?? null;
}
