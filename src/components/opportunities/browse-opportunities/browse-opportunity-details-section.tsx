import { findPublishedOpportunityById } from '@/lib/dal/opportunity';
import { BrowseOpportunityDetails } from './browse-opportunity-details';
import { BrowseOpportunitySignupForm } from './browse-opportunity-signup-form';

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

  const durationHours =
    (opportunity.endTime.getTime() - opportunity.startTime.getTime()) /
    3_600_000;
  const defaultHours = Math.min(
    24,
    Math.max(0.5, Math.round(durationHours * 2) / 2),
  );

  return (
    <BrowseOpportunityDetails opportunity={opportunity}>
      <BrowseOpportunitySignupForm
        opportunityId={opportunity.id}
        mealProvided={opportunity.mealProvided}
        tshirtProvided={opportunity.tshirtProvided}
        mealOptions={opportunity.mealOptions}
        defaultHours={defaultHours}
      />
    </BrowseOpportunityDetails>
  );
}
