import { eq } from 'drizzle-orm';
import { refresh } from 'next/cache';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { opportunities, projects } from '@/db/schema';
import {
  addOpportunityToProjectAction,
  deleteProjectAction,
  removeOpportunityFromProjectAction,
  saveProjectAction,
  toggleProjectPublishAction,
} from '@/lib/actions/project';
import { getCurrentAppUser } from '@/lib/auth';
import {
  asActiveAppUser,
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  insertProject,
  setOpportunityProject,
} from '../dal-tests/dal-test-utils';

vi.mock('@/lib/auth', () => ({
  getCurrentAppUser: vi.fn(),
}));

describe('project actions', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
    vi.clearAllMocks();
  });

  async function projectCount() {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, tenant.id));
    return rows.length;
  }

  describe('authorization', () => {
    it('rejects every project action for a non-admin employee', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      vi.mocked(getCurrentAppUser).mockResolvedValue(
        asActiveAppUser(volunteer),
      );

      await expect(
        saveProjectAction(null, { title: 'Sneaky', description: null }),
      ).rejects.toThrow('Not authorized');
      await expect(toggleProjectPublishAction(project.id)).rejects.toThrow(
        'Not authorized',
      );
      await expect(deleteProjectAction(project.id)).rejects.toThrow(
        'Not authorized',
      );
      await expect(
        addOpportunityToProjectAction(project.id, oppId),
      ).rejects.toThrow('Not authorized');
      await expect(
        removeOpportunityFromProjectAction(project.id, oppId),
      ).rejects.toThrow('Not authorized');

      expect(await projectCount()).toBe(1);
    });

    it('rejects a signed-out caller', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue({ status: 'signed-out' });

      await expect(
        saveProjectAction(null, { title: 'Nope', description: null }),
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('saveProjectAction', () => {
    beforeEach(() => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
    });

    it('creates a project and returns its id', async () => {
      const result = await saveProjectAction(null, {
        title: ' Earth Week ',
        description: '',
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      const [row] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, result.id));
      expect(row).toMatchObject({ title: 'Earth Week', description: null });
    });

    it('updates an existing project', async () => {
      const project = await insertProject(tenant.id, admin.id);

      const result = await saveProjectAction(project.id, {
        title: 'Renamed',
        description: 'New',
      });

      expect(result).toEqual({ success: true, id: project.id });
    });

    it('rejects invalid input without writing', async () => {
      const result = await saveProjectAction(null, {
        title: 'x',
        description: null,
      });

      expect(result).toEqual({
        success: false,
        message: 'Please fix the errors in the form',
      });
      expect(await projectCount()).toBe(0);
    });

    it("returns not-found for another tenant's project", async () => {
      const other = await createTestTenantAndAdmin();
      try {
        const foreign = await insertProject(other.tenant.id, other.admin.id);

        const result = await saveProjectAction(foreign.id, {
          title: 'Hijack',
          description: null,
        });

        expect(result.success).toBe(false);
        const [row] = await db
          .select()
          .from(projects)
          .where(eq(projects.id, foreign.id));
        expect(row.title).toBe('Service Week');
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });
  });

  describe('assignment actions', () => {
    beforeEach(() => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
    });

    it('adds and removes an opportunity, refreshing the page', async () => {
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);

      expect(await addOpportunityToProjectAction(project.id, oppId)).toEqual({
        success: true,
      });
      expect(
        await removeOpportunityFromProjectAction(project.id, oppId),
      ).toEqual({ success: true });
      expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('explains when the opportunity is already in another project', async () => {
      const first = await insertProject(tenant.id, admin.id);
      const second = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, first.id);

      expect(await addOpportunityToProjectAction(second.id, oppId)).toEqual({
        success: false,
        message: 'That opportunity already belongs to another project.',
      });
    });

    it('rejects ids that are not uuids', async () => {
      const project = await insertProject(tenant.id, admin.id);

      expect(
        (await addOpportunityToProjectAction(project.id, 'nope')).success,
      ).toBe(false);
      expect((await deleteProjectAction('nope')).success).toBe(false);
    });
  });

  describe('deleteProjectAction', () => {
    it('deletes the project and keeps its opportunities', async () => {
      vi.mocked(getCurrentAppUser).mockResolvedValue(asActiveAppUser(admin));
      const project = await insertProject(tenant.id, admin.id);
      const oppId = await createPublished(tenant.id, admin.id);
      await setOpportunityProject(oppId, project.id);

      expect(await deleteProjectAction(project.id)).toEqual({ success: true });

      const [opp] = await db
        .select()
        .from(opportunities)
        .where(eq(opportunities.id, oppId));
      expect(opp.deletedAt).toBeNull();
      expect(opp.projectId).toBeNull();
    });
  });
});
