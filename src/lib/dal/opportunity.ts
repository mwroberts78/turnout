import { and, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { type Opportunity, opportunities, signUps } from '@/db/schema';
import { mockDelay } from '../utils/mockDelay';
import { withTenantContext } from './withTenantContext';

export type OpportunityWithDetails = NonNullable<
  Awaited<ReturnType<typeof findOpportunityById>>
>;

export async function findOpportunitiesByTenant(
  tenantId: string,
): Promise<(Opportunity & { signupCount: number })[]> {
  await mockDelay(3000);

  return withTenantContext(tenantId, (tx) =>
    tx
      .select({
        ...getTableColumns(opportunities),
        signupCount: sql<number>`count(${signUps.id})`.mapWith(Number),
      })
      .from(opportunities)
      .leftJoin(
        signUps,
        and(
          eq(signUps.opportunityId, opportunities.id),
          isNull(signUps.deletedAt),
        ),
      )
      .where(eq(opportunities.tenantId, tenantId))
      .groupBy(opportunities.id)
      .orderBy(desc(opportunities.startTime)),
  );
}

export async function findOpportunityById(oppId: string, tenantId: string) {
  await mockDelay(3000);

  return withTenantContext(tenantId, (tx) =>
    tx.query.opportunities.findFirst({
      where: eq(opportunities.id, oppId),
      with: {
        mealOptions: true,
        creator: {
          columns: { firstName: true, lastName: true, email: true },
        },
        updater: {
          columns: { firstName: true, lastName: true, email: true },
        },
        signUps: {
          where: isNull(signUps.deletedAt),
          columns: { id: true },
        },
      },
    }),
  );
}

export async function findSignupsForOpportunity(
  oppId: string,
  tenantId: string,
) {
  await mockDelay(3000);

  return withTenantContext(tenantId, (tx) =>
    tx.query.signUps.findMany({
      where: and(eq(signUps.opportunityId, oppId), isNull(signUps.deletedAt)),
      with: {
        user: {
          columns: { firstName: true, lastName: true, email: true },
        },
        selectedMealOption: { columns: { mealName: true } },
      },
    }),
  );
}
