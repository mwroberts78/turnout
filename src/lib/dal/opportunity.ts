import { desc, eq } from 'drizzle-orm';
import { type Opportunity, opportunities } from '@/db/schema';
import { withTenantContext } from './withTenantContext';

export async function findOpportunitiesByTenant(
  tenantId: string,
): Promise<Opportunity[]> {
  return withTenantContext(tenantId, (tx) =>
    tx.query.opportunities.findMany({
      where: eq(opportunities.tenantId, tenantId),
      orderBy: desc(opportunities.startTime),
    }),
  );
}
