import { findSignupsForOpportunity } from '@/lib/dal/opportunity';
import { columns } from './view-opportunity-signups-table/columns';
import { DataTable } from './view-opportunity-signups-table/data-table';

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
  return <DataTable data={signups} columns={columns} isAdmin={isAdmin} />;
}
