import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  isNull,
  lte,
  sql,
} from 'drizzle-orm';
import { opportunities, signUps, users } from '@/db/schema';
import { mockDelay } from '../utils/mockDelay';
import { type ReportRange, reportRangeStart } from '../utils/reportRange';
import { withTenantContext } from './withTenantContext';

export type VolunteerSummary = Awaited<ReturnType<typeof getVolunteerSummary>>;
export type TenantReport = Awaited<ReturnType<typeof getTenantReport>>;

// Hours only count once an admin marks the work completed. Actual hours win
// when recorded; otherwise the volunteer's estimate stands in.
const confirmedHours =
  sql<number>`coalesce(sum(coalesce(${signUps.actualHours}, ${signUps.estimatedHours})) filter (where ${signUps.workCompleted}), 0)`.mapWith(
    Number,
  );

const completedCount =
  sql<number>`count(${signUps.id}) filter (where ${signUps.workCompleted})`.mapWith(
    Number,
  );

const activeSignUp = and(
  eq(signUps.opportunityId, opportunities.id),
  isNull(signUps.deletedAt),
);

export async function getVolunteerSummary(
  tenantId: string,
  userId: string,
  now: Date = new Date(),
) {
  await mockDelay();

  const [summary] = await withTenantContext(tenantId, (tx) =>
    tx
      .select({
        hours: confirmedHours,
        completedCount,
        upcomingCount:
          sql<number>`count(${signUps.id}) filter (where ${opportunities.startTime} > ${now.toISOString()}::timestamptz)`.mapWith(
            Number,
          ),
        awaitingCount:
          sql<number>`count(${signUps.id}) filter (where ${opportunities.startTime} <= ${now.toISOString()}::timestamptz and not ${signUps.workCompleted})`.mapWith(
            Number,
          ),
      })
      .from(signUps)
      .innerJoin(opportunities, activeSignUp)
      .where(
        and(
          eq(signUps.tenantId, tenantId),
          eq(signUps.userId, userId),
          isNull(opportunities.deletedAt),
        ),
      ),
  );

  return summary;
}

export async function getTenantReport(
  tenantId: string,
  range: ReportRange,
  now: Date = new Date(),
) {
  await mockDelay();

  const since = reportRangeStart(range, now);

  // Reports cover opportunities that have already started within the range;
  // upcoming activity is reported separately as a single count.
  const inRange = and(
    eq(opportunities.tenantId, tenantId),
    eq(opportunities.isPublished, true),
    isNull(opportunities.deletedAt),
    lte(opportunities.startTime, now),
    since ? gte(opportunities.startTime, since) : undefined,
  );

  return withTenantContext(tenantId, async (tx) => {
    const byOpportunity = await tx
      .select({
        id: opportunities.id,
        title: opportunities.title,
        opportunityType: opportunities.opportunityType,
        startTime: opportunities.startTime,
        endTime: opportunities.endTime,
        timeZone: opportunities.timeZone,
        maxSignupsAllowed: opportunities.maxSignupsAllowed,
        signupCount: count(signUps.id),
        completedCount,
        hours: confirmedHours,
      })
      .from(opportunities)
      .leftJoin(signUps, activeSignUp)
      .where(inRange)
      .groupBy(opportunities.id)
      .orderBy(desc(opportunities.startTime));

    const byVolunteer = await tx
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        signupCount: count(signUps.id),
        completedCount,
        hours: confirmedHours,
      })
      .from(signUps)
      .innerJoin(opportunities, activeSignUp)
      .innerJoin(users, eq(users.id, signUps.userId))
      .where(inRange)
      .groupBy(users.id)
      .orderBy(desc(confirmedHours), asc(users.lastName), asc(users.firstName));

    const [{ activeEmployees }] = await tx
      .select({ activeEmployees: count() })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)));

    const [{ upcomingSignups }] = await tx
      .select({ upcomingSignups: count(signUps.id) })
      .from(signUps)
      .innerJoin(opportunities, activeSignUp)
      .where(
        and(
          eq(opportunities.tenantId, tenantId),
          isNull(opportunities.deletedAt),
          gt(opportunities.startTime, now),
        ),
      );

    const signupCount = byOpportunity.reduce(
      (sum, o) => sum + o.signupCount,
      0,
    );
    const completed = byOpportunity.reduce(
      (sum, o) => sum + o.completedCount,
      0,
    );

    return {
      totals: {
        hours: byOpportunity.reduce((sum, o) => sum + o.hours, 0),
        opportunities: byOpportunity.length,
        signups: signupCount,
        completed,
        awaitingConfirmation: signupCount - completed,
        volunteers: byVolunteer.length,
        activeEmployees,
        participationRate:
          activeEmployees === 0 ? 0 : byVolunteer.length / activeEmployees,
        upcomingSignups,
      },
      byOpportunity,
      byVolunteer,
    };
  });
}
