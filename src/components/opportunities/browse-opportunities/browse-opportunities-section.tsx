import { Card, CardContent } from '@/components/base-ui/card';
import { findPublishedOpportunities } from '@/lib/dal/opportunity';
import { BrowseOpportunityCard } from './browse-opportunity-card';

export async function BrowseOpportunitiesSection({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const opportunities = await findPublishedOpportunities(tenantId, userId);

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No upcoming opportunities right now. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {opportunities.map((opportunity) => (
        <BrowseOpportunityCard key={opportunity.id} opportunity={opportunity} />
      ))}
    </div>
  );
}
