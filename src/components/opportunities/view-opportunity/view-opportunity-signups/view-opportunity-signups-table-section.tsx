import { findSignupsForOpportunity } from '@/lib/dal/opportunity';
import { ViewOpportunitySignupsTable } from './view-opportunity-signups-table/view-opportunity-signups-table';
import { viewOpportunitySignupsTableColumns } from './view-opportunity-signups-table/view-opportunity-signups-table-columns';

export async function ViewOpportunitySignupsTableSection({
  oppId,
  tenantId,
  isAdmin,
}: {
  oppId: string;
  tenantId: string;
  isAdmin: boolean;
}) {
  const signups = await findSignupsForOpportunity(oppId, tenantId);
  return (
    <ViewOpportunitySignupsTable
      data={signups}
      columns={viewOpportunitySignupsTableColumns}
      isAdmin={isAdmin}
    />
  );
}
