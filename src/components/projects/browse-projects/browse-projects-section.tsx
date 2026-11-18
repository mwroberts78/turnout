import { Card, CardContent } from '@/components/base-ui/card';
import { findPublishedProjects } from '@/lib/dal/project';
import { BrowseProjectCard } from './browse-project-card';

export async function BrowseProjectsSection({
  tenantId,
}: {
  tenantId: string;
}) {
  const projects = await findPublishedProjects(tenantId);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No projects are running right now. Check back soon.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <BrowseProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
