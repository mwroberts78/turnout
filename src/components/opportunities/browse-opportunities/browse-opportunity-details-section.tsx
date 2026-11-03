import { findPublishedOpportunityById } from '@/lib/dal/opportunity';
import { BrowseOpportunityDetails } from './browse-opportunity-details';

export async function BrowseOpportunityDetailsSection({
  id,
  tenantId,
  userId,
}: {
  id: string;
  tenantId: string;
  userId: string;
}) {
  const opportunity = await findPublishedOpportunityById(id, tenantId, userId);

  if (!opportunity) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        This opportunity isn't available. It may have been unpublished or
        removed.
      </p>
    );
  }

  return <BrowseOpportunityDetails opportunity={opportunity} />;
}
