import { and, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { type Opportunity, opportunities, signUps } from '@/db/schema';
import { mockDelay } from '../utils/mockDelay';
import { withTenantContext } from './withTenantContext';

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
