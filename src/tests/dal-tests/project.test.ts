import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { opportunities, projects } from '@/db/schema';
import {
  findOpportunitiesByTenant,
  findPublishedOpportunities,
  findPublishedOpportunityById,
} from '@/lib/dal/opportunity';
import {
  assignOpportunityToProject,
  createProject,
  deleteProject,
  findProjectById,
  findProjectsByTenant,
  findPublishedProjectById,
  findPublishedProjects,
  findUnassignedOpportunities,
  moveOpportunityToProject,
  removeOpportunityFromProject,
  toggleProjectPublish,
  updateProject,
} from '@/lib/dal/project';
import {
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
  insertProject,
  insertSignUp,
  setOpportunityProject,
} from './dal-test-utils';

describe('project DAL', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
  });

  async function findProjectRow(projectId: string) {
    const [row] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));
    return row;
  }

  async function findOpportunityProjectId(oppId: string) {
    const [row] = await db
      .select({ projectId: opportunities.projectId })
      .from(opportunities)
      .where(eq(opportunities.id, oppId));
    return row.projectId;
  }

  describe('createProject / updateProject', () => {
    it('creates an unpublished project owned by the tenant', async () => {
      const id = await createProject(tenant.id, admin.id, {
        title: 'Earth Week',
        description: 'Five days of service',
      });

      expect(await findProjectRow(id)).toMatchObject({
        tenantId: tenant.id,
        title: 'Earth Week',
        isPublished: false,
        createdBy: admin.id,
      });
    });

    it('updates a project and records the editor', async () => {
      const project = await insertProject(tenant.id, admin.id);

      const id = await updateProject(project.id, tenant.id, admin.id, {
        title: 'Renamed',
        description: null,
      });

      expect(id).toBe(project.id);
      expect(await findProjectRow(project.id)).toMatchObject({
        title: 'Renamed',
        description: null,
        updatedBy: admin.id,
      });
    });

    it('returns null when updating a deleted project', async () => {
      const project = await insertProject(tenant.id, admin.id, {
        deletedAt: new Date(),
      });

      expect(
        await updateProject(project.id, tenant.id, admin.id, {
          title: 'Nope',
          description: null,
        }),
      ).toBeNull();
    });
  });

  describe('findProjectsByTenant', () => {
    it('counts live opportunities and spans their dates', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const first = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(3),
        endTime: daysFromNow(3, 16),
      });
      const last = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(9),
        endTime: daysFromNow(9, 18),
      });
      const removed = await createPublished(tenant.id, admin.id);
      for (const oppId of [first, last, removed]) {
        await setOpportunityProject(oppId, project.id);
      }
      await db
        .update(opportunities)
        .set({ deletedAt: new Date() })
        .where(eq(opportunities.id, removed));
      await insertProject(tenant.id, admin.id, { deletedAt: new Date() });

      const result = await findProjectsByTenant(tenant.id);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: project.id,
        opportunityCount: 2,
        firstStart: daysFromNow(3),
        lastEnd: daysFromNow(9, 18),
      });
    });

    it('lists an empty project with no dates', async () => {
      await insertProject(tenant.id, admin.id);

      const [result] = await findProjectsByTenant(tenant.id);

      expect(result).toMatchObject({
        opportunityCount: 0,
        firstStart: null,
        lastEnd: null,
      });
    });
  });

  describe('findProjectById', () => {
    it('returns the project with its opportunities and signup counts', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id, {
        title: 'Planting',
      });
      await setOpportunityProject(oppId, project.id);
      const volunteer = await createTestVolunteer(tenant.id);
      await insertSignUp(tenant.id, volunteer.id, oppId);

      const result = await findProjectById(project.id, tenant.id);

      expect(result?.creator).toEqual({ firstName: 'DAL', lastName: 'Tester' });
      expect(result?.opportunities).toMatchObject([
        { id: oppId, title: 'Planting', signupCount: 1 },
      ]);
    });

    it("returns null for a deleted or another tenant's project", async () => {
      const deleted = await insertProject(tenant.id, admin.id, {
        deletedAt: new Date(),
      });
      const other = await createTestTenantAndAdmin();
      try {
        const foreign = await insertProject(other.tenant.id, other.admin.id);

        expect(await findProjectById(deleted.id, tenant.id)).toBeNull();
        expect(await findProjectById(foreign.id, tenant.id)).toBeNull();
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });
  });

  describe('assignOpportunityToProject / removeOpportunityFromProject', () => {
    it('assigns an unassigned opportunity and removes it again', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);

      expect(
        await assignOpportunityToProject(
          oppId,
          project.id,
          tenant.id,
          admin.id,
        ),
      ).toEqual({ ok: true });
      expect(await findOpportunityProjectId(oppId)).toBe(project.id);
      expect(await findUnassignedOpportunities(tenant.id)).toEqual([]);

      expect(
        await removeOpportunityFromProject(
          oppId,
          project.id,
          tenant.id,
          admin.id,
        ),
      ).toBe(true);
      expect(await findOpportunityProjectId(oppId)).toBeNull();
    });

    it('refuses to move an opportunity out of another project', async () => {
      const first = await insertProject(tenant.id, admin.id);
      const second = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, first.id);

      expect(
        await assignOpportunityToProject(oppId, second.id, tenant.id, admin.id),
      ).toEqual({ ok: false, reason: 'in-other-project' });
      expect(await findOpportunityProjectId(oppId)).toBe(first.id);
    });

    it('rejects a deleted project or deleted opportunity', async () => {
      const deletedProject = await insertProject(tenant.id, admin.id, {
        deletedAt: new Date(),
      });
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      const deletedOpp = await createPublished(tenant.id, admin.id);
      await db
        .update(opportunities)
        .set({ deletedAt: new Date() })
        .where(eq(opportunities.id, deletedOpp));

      expect(
        await assignOpportunityToProject(
          oppId,
          deletedProject.id,
          tenant.id,
          admin.id,
        ),
      ).toEqual({ ok: false, reason: 'project-not-found' });
      expect(
        await assignOpportunityToProject(
          deletedOpp,
          project.id,
          tenant.id,
          admin.id,
        ),
      ).toEqual({ ok: false, reason: 'opportunity-not-found' });
    });

    it("never assigns another tenant's opportunity", async () => {
      const project = await insertProject(tenant.id, admin.id);
      const other = await createTestTenantAndAdmin();
      try {
        const foreignOpp = await createPublished(
          other.tenant.id,
          other.admin.id,
        );

        expect(
          await assignOpportunityToProject(
            foreignOpp,
            project.id,
            tenant.id,
            admin.id,
          ),
        ).toEqual({ ok: false, reason: 'opportunity-not-found' });
        expect(await findOpportunityProjectId(foreignOpp)).toBeNull();
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });

    it('returns false when removing from the wrong project', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const other = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, project.id);

      expect(
        await removeOpportunityFromProject(
          oppId,
          other.id,
          tenant.id,
          admin.id,
        ),
      ).toBe(false);
      expect(await findOpportunityProjectId(oppId)).toBe(project.id);
    });
  });

  describe('moveOpportunityToProject', () => {
    it('moves between projects and ungroups with null', async () => {
      const first = await insertProject(tenant.id, admin.id);
      const second = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, first.id);

      expect(
        await moveOpportunityToProject(oppId, second.id, tenant.id, admin.id),
      ).toEqual({ ok: true });
      expect(await findOpportunityProjectId(oppId)).toBe(second.id);

      expect(
        await moveOpportunityToProject(oppId, null, tenant.id, admin.id),
      ).toEqual({ ok: true });
      expect(await findOpportunityProjectId(oppId)).toBeNull();
    });

    it("rejects a deleted or another tenant's project", async () => {
      const deleted = await insertProject(tenant.id, admin.id, {
        deletedAt: new Date(),
      });
      const oppId = await createPublished(tenant.id, admin.id);
      const other = await createTestTenantAndAdmin();
      try {
        const foreign = await insertProject(other.tenant.id, other.admin.id);

        for (const projectId of [deleted.id, foreign.id]) {
          expect(
            await moveOpportunityToProject(
              oppId,
              projectId,
              tenant.id,
              admin.id,
            ),
          ).toEqual({ ok: false, reason: 'project-not-found' });
        }
        expect(await findOpportunityProjectId(oppId)).toBeNull();
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });

    it("rejects another tenant's opportunity", async () => {
      const project = await insertProject(tenant.id, admin.id);
      const other = await createTestTenantAndAdmin();
      try {
        const foreignOpp = await createPublished(
          other.tenant.id,
          other.admin.id,
        );

        expect(
          await moveOpportunityToProject(
            foreignOpp,
            project.id,
            tenant.id,
            admin.id,
          ),
        ).toEqual({ ok: false, reason: 'opportunity-not-found' });
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });
  });

  describe('toggleProjectPublish / deleteProject', () => {
    it('flips the published flag', async () => {
      const project = await insertProject(tenant.id, admin.id);

      expect(await toggleProjectPublish(project.id, tenant.id, admin.id)).toBe(
        true,
      );
      expect((await findProjectRow(project.id)).isPublished).toBe(true);
    });

    it('soft-deletes the project and ungroups its opportunities', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, project.id);

      expect(await deleteProject(project.id, tenant.id, admin.id)).toBe(true);

      const row = await findProjectRow(project.id);
      expect(row.deletedAt).not.toBeNull();
      expect(row.deletedBy).toBe(admin.id);
      expect(await findOpportunityProjectId(oppId)).toBeNull();
    });

    it('returns false for a project that is already deleted', async () => {
      const project = await insertProject(tenant.id, admin.id, {
        deletedAt: new Date(),
      });

      expect(await deleteProject(project.id, tenant.id, admin.id)).toBe(false);
      expect(await toggleProjectPublish(project.id, tenant.id, admin.id)).toBe(
        false,
      );
    });
  });

  describe('employee-facing queries', () => {
    it('lists published projects that still have upcoming opportunities', async () => {
      const active = await insertProject(tenant.id, admin.id, {
        title: 'Active',
        isPublished: true,
      });
      const finished = await insertProject(tenant.id, admin.id, {
        title: 'Finished',
        isPublished: true,
      });
      const draft = await insertProject(tenant.id, admin.id, {
        title: 'Draft',
      });

      const soon = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(2),
        endTime: daysFromNow(2, 16),
      });
      const later = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(6),
        endTime: daysFromNow(6, 16),
      });
      const unpublished = await createPublished(tenant.id, admin.id);
      await db
        .update(opportunities)
        .set({ isPublished: false })
        .where(eq(opportunities.id, unpublished));
      const past = await createPublished(tenant.id, admin.id, {
        startTime: daysFromNow(-2),
        endTime: daysFromNow(-2, 16),
      });
      const inDraft = await createPublished(tenant.id, admin.id);

      for (const oppId of [soon, later, unpublished]) {
        await setOpportunityProject(oppId, active.id);
      }
      await setOpportunityProject(past, finished.id);
      await setOpportunityProject(inDraft, draft.id);

      const result = await findPublishedProjects(tenant.id);

      expect(result).toEqual([
        {
          id: active.id,
          title: 'Active',
          description: null,
          upcomingCount: 2,
          nextStart: daysFromNow(2),
          lastEnd: daysFromNow(6, 16),
        },
      ]);
      expect(await findPublishedProjectById(draft.id, tenant.id)).toBeNull();
      expect(
        (await findPublishedProjectById(active.id, tenant.id))?.title,
      ).toBe('Active');
    });

    it('filters published opportunities to one project', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const project = await insertProject(tenant.id, admin.id, {
        isPublished: true,
      });
      const inside = await createPublished(tenant.id, admin.id, {
        title: 'Inside',
      });
      await createPublished(tenant.id, admin.id, { title: 'Outside' });
      await setOpportunityProject(inside, project.id);

      const result = await findPublishedOpportunities(tenant.id, volunteer.id, {
        projectId: project.id,
      });

      expect(result.map((o) => o.title)).toEqual(['Inside']);
    });

    it('names the project on listed opportunities only once it is published', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const project = await insertProject(tenant.id, admin.id, {
        title: 'Earth Week',
      });
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, project.id);

      const [beforePublish] = await findPublishedOpportunities(
        tenant.id,
        volunteer.id,
      );
      expect(beforePublish.projectTitle).toBeNull();

      await toggleProjectPublish(project.id, tenant.id, admin.id);

      const [afterPublish] = await findPublishedOpportunities(
        tenant.id,
        volunteer.id,
      );
      expect(afterPublish.projectTitle).toBe('Earth Week');
    });

    it('always names the project in the admin list, but not a deleted one', async () => {
      const project = await insertProject(tenant.id, admin.id, {
        title: 'Draft Project',
      });
      const gone = await insertProject(tenant.id, admin.id, {
        title: 'Gone',
        deletedAt: new Date(),
      });
      const inDraft = await createPublished(tenant.id, admin.id, {
        title: 'In draft project',
      });
      const inGone = await createPublished(tenant.id, admin.id, {
        title: 'In deleted project',
      });
      await setOpportunityProject(inDraft, project.id);
      await setOpportunityProject(inGone, gone.id);

      const rows = await findOpportunitiesByTenant(tenant.id);

      expect(
        Object.fromEntries(rows.map((r) => [r.title, r.projectTitle])),
      ).toEqual({
        'In draft project': 'Draft Project',
        'In deleted project': null,
      });
    });

    it('links an opportunity to its project only when the project is published', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const project = await insertProject(tenant.id, admin.id, {
        title: 'Earth Week',
      });
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, project.id);

      expect(
        (await findPublishedOpportunityById(oppId, tenant.id, volunteer.id))
          ?.project,
      ).toBeNull();

      await toggleProjectPublish(project.id, tenant.id, admin.id);

      expect(
        (await findPublishedOpportunityById(oppId, tenant.id, volunteer.id))
          ?.project,
      ).toEqual({ id: project.id, title: 'Earth Week' });
    });
  });
});
