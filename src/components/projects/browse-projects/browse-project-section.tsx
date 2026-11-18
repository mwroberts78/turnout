import { notFound } from 'next/navigation';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { Card, CardContent } from '@/components/base-ui/card';
import { BrowseOpportunityCard } from '@/components/opportunities/browse-opportunities/browse-opportunity-card';
import { findPublishedOpportunities } from '@/lib/dal/opportunity';
import { findPublishedProjectById } from '@/lib/dal/project';

export async function BrowseProjectSection({
  id,
  tenantId,
  userId,
}: {
  id: string;
  tenantId: string;
  userId: string;
}) {
  const project = await findPublishedProjectById(id, tenantId);

  if (!project) notFound();

  const opportunities = await findPublishedOpportunities(tenantId, userId, {
    projectId: project.id,
  });

  return (
    <>
      <AppBreadcrumb overrides={{ '/projects/[id]': project.title }} />
      <div className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {project.title}
          </h1>
          {project.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>

        {opportunities.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              This project has no upcoming opportunities right now.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {opportunities.map((opportunity) => (
              <BrowseOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
