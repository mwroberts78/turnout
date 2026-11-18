import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db';
import { opportunities, users } from '@/db/schema';
import { getTenantReport, getVolunteerSummary } from '@/lib/dal/report';
import {
  cleanupTestTenant,
  createPublished,
  createTestTenantAndAdmin,
  createTestVolunteer,
  daysFromNow,
  insertSignUp,
} from './dal-test-utils';

describe('report DAL', () => {
  let tenant: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['tenant'];
  let admin: Awaited<ReturnType<typeof createTestTenantAndAdmin>>['admin'];

  beforeEach(async () => {
    ({ tenant, admin } = await createTestTenantAndAdmin());
  });

  afterEach(async () => {
    await cleanupTestTenant(tenant.id);
  });

  function pastOpportunity(daysAgo: number, title = 'Past') {
    return createPublished(tenant.id, admin.id, {
      title,
      startTime: daysFromNow(-daysAgo),
      endTime: daysFromNow(-daysAgo, 16),
    });
  }

  describe('getVolunteerSummary', () => {
    it('is all zeros for someone who has never signed up', async () => {
      const volunteer = await createTestVolunteer(tenant.id);

      expect(await getVolunteerSummary(tenant.id, volunteer.id)).toEqual({
        hours: 0,
        completedCount: 0,
        upcomingCount: 0,
        awaitingCount: 0,
      });
    });

    it('counts confirmed hours, preferring actual hours over the estimate', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const first = await pastOpportunity(5);
      const second = await pastOpportunity(3);
      const third = await pastOpportunity(1);
      const upcoming = await createPublished(tenant.id, admin.id);

      await insertSignUp(tenant.id, volunteer.id, first, {
        workCompleted: true,
        estimatedHours: 2,
        actualHours: 3.5,
      });
      await insertSignUp(tenant.id, volunteer.id, second, {
        workCompleted: true,
        estimatedHours: 2,
      });
      await insertSignUp(tenant.id, volunteer.id, third, {
        estimatedHours: 4,
      });
      await insertSignUp(tenant.id, volunteer.id, upcoming);

      expect(await getVolunteerSummary(tenant.id, volunteer.id)).toEqual({
        hours: 5.5,
        completedCount: 2,
        upcomingCount: 1,
        awaitingCount: 1,
      });
    });

    it('ignores cancelled signups and deleted opportunities', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const cancelled = await pastOpportunity(2);
      const deleted = await pastOpportunity(3);

      await insertSignUp(tenant.id, volunteer.id, cancelled, {
        workCompleted: true,
        deletedAt: new Date(),
      });
      await insertSignUp(tenant.id, volunteer.id, deleted, {
        workCompleted: true,
      });
      await db
        .update(opportunities)
        .set({ deletedAt: new Date() })
        .where(eq(opportunities.id, deleted));

      expect((await getVolunteerSummary(tenant.id, volunteer.id)).hours).toBe(
        0,
      );
    });
  });

  describe('getTenantReport', () => {
    it('summarizes opportunities and volunteers within the range', async () => {
      const avery = await createTestVolunteer(tenant.id);
      const blake = await createTestVolunteer(tenant.id);
      await createTestVolunteer(tenant.id);

      const cleanup = await pastOpportunity(10, 'Cleanup');
      const tutoring = await pastOpportunity(5, 'Tutoring');

      await insertSignUp(tenant.id, avery.id, cleanup, {
        workCompleted: true,
        actualHours: 4,
      });
      await insertSignUp(tenant.id, blake.id, cleanup, {
        workCompleted: true,
        estimatedHours: 2,
      });
      await insertSignUp(tenant.id, avery.id, tutoring, {
        estimatedHours: 1,
      });

      const report = await getTenantReport(tenant.id, '30d');

      expect(report.totals).toEqual({
        hours: 6,
        opportunities: 2,
        signups: 3,
        completed: 2,
        awaitingConfirmation: 1,
        volunteers: 2,
        activeEmployees: 4,
        participationRate: 0.5,
        upcomingSignups: 0,
      });

      expect(
        report.byOpportunity.map((o) => [o.title, o.signupCount, o.hours]),
      ).toEqual([
        ['Tutoring', 1, 0],
        ['Cleanup', 2, 6],
      ]);

      expect(
        report.byVolunteer.map((v) => [v.id, v.signupCount, v.hours]),
      ).toEqual([
        [avery.id, 2, 4],
        [blake.id, 1, 2],
      ]);
    });

    it('leaves out opportunities before the range, upcoming ones, and drafts', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const old = await pastOpportunity(45, 'Old');
      const recent = await pastOpportunity(5, 'Recent');
      const upcoming = await createPublished(tenant.id, admin.id, {
        title: 'Upcoming',
      });
      const draft = await pastOpportunity(3, 'Draft');
      await db
        .update(opportunities)
        .set({ isPublished: false })
        .where(eq(opportunities.id, draft));

      for (const oppId of [old, recent, upcoming]) {
        await insertSignUp(tenant.id, volunteer.id, oppId);
      }

      const report = await getTenantReport(tenant.id, '30d');

      expect(report.byOpportunity.map((o) => o.title)).toEqual(['Recent']);
      expect(report.totals.upcomingSignups).toBe(1);

      const allTime = await getTenantReport(tenant.id, 'all');
      expect(allTime.byOpportunity.map((o) => o.title)).toEqual([
        'Recent',
        'Old',
      ]);
    });

    it('lists opportunities with no signups as zero rows', async () => {
      await pastOpportunity(2, 'Quiet');

      const report = await getTenantReport(tenant.id, '30d');

      expect(report.byOpportunity).toMatchObject([
        { title: 'Quiet', signupCount: 0, completedCount: 0, hours: 0 },
      ]);
      expect(report.byVolunteer).toEqual([]);
    });

    it('excludes cancelled signups and deleted employees from headcount', async () => {
      const volunteer = await createTestVolunteer(tenant.id);
      const leaver = await createTestVolunteer(tenant.id);
      const oppId = await pastOpportunity(2);

      await insertSignUp(tenant.id, volunteer.id, oppId, {
        deletedAt: new Date(),
      });
      await db
        .update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, leaver.id));

      const report = await getTenantReport(tenant.id, '30d');

      expect(report.totals.signups).toBe(0);
      expect(report.totals.activeEmployees).toBe(2);
    });

    it("never includes another tenant's data", async () => {
      const other = await createTestTenantAndAdmin();
      try {
        const oppId = await createPublished(other.tenant.id, other.admin.id, {
          startTime: daysFromNow(-2),
          endTime: daysFromNow(-2, 16),
        });
        await insertSignUp(other.tenant.id, other.admin.id, oppId, {
          workCompleted: true,
        });

        const report = await getTenantReport(tenant.id, 'all');

        expect(report.byOpportunity).toEqual([]);
        expect(report.totals.hours).toBe(0);
      } finally {
        await cleanupTestTenant(other.tenant.id);
      }
    });
  });
});
