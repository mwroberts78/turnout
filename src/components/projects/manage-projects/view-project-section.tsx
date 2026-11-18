import { Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppBreadcrumb } from '@/components/app-ui/app-breadcrumb';
import { AppDateTime } from '@/components/app-ui/app-date-time';
import { AppInfoCard } from '@/components/app-ui/app-info-card';
import { AppOpportunityBadge } from '@/components/app-ui/app-opportunity-badge';
import { Badge } from '@/components/base-ui/badge';
import { Button } from '@/components/base-ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/base-ui/table';
import {
  findProjectById,
  findUnassignedOpportunities,
} from '@/lib/dal/project';
import { ProjectStatusBadge } from '../project-status-badge';
import { ProjectAddOpportunity } from './project-add-opportunity';
import { ProjectDeleteButton } from './project-delete-button';
import { ProjectPublishButton } from './project-publish-button';
import { ProjectRemoveOpportunityButton } from './project-remove-opportunity-button';

export async function ViewProjectSection({
  id,
  tenantId,
}: {
  id: string;
  tenantId: string;
}) {
  const [project, candidates] = await Promise.all([
    findProjectById(id, tenantId),
    findUnassignedOpportunities(tenantId),
  ]);

  if (!project) notFound();

  const hasPublishedOpportunity = project.opportunities.some(
    (o) => o.isPublished,
  );

  return (
    <>
      <AppBreadcrumb overrides={{ '/projects/manage/[id]': project.title }} />
      <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
              {project.title}
            </h1>
            <ProjectStatusBadge isPublished={project.isPublished} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/projects/manage/${project.id}/edit`} />}
              nativeButton={false}
            >
              <Pencil />
              Edit
            </Button>
            <ProjectPublishButton
              projectId={project.id}
              isPublished={project.isPublished}
            />
            <ProjectDeleteButton projectId={project.id} title={project.title} />
          </div>
        </div>

        {project.isPublished && !hasPublishedOpportunity && (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Employees won't see this project until it has at least one
            published, upcoming opportunity.
          </p>
        )}

        {project.description && (
          <AppInfoCard title="Description">
            <p className="whitespace-pre-line">{project.description}</p>
          </AppInfoCard>
        )}

        <AppInfoCard title="Opportunities">
          <div className="space-y-4">
            {project.opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No opportunities in this project yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Signups</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.opportunities.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="max-w-64">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/opportunities/manage/${o.id}`}
                            className="truncate font-medium hover:underline"
                          >
                            {o.title}
                          </Link>
                          <div>
                            <AppOpportunityBadge
                              opportunityType={o.opportunityType}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <AppDateTime
                          start={o.startTime}
                          end={o.endTime}
                          timeZone={o.timeZone}
                          variant="inline"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.isPublished ? 'default' : 'outline'}>
                          {o.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {o.signupCount}
                        {o.maxSignupsAllowed !== null && (
                          <span className="text-muted-foreground">
                            {' '}
                            / {o.maxSignupsAllowed}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ProjectRemoveOpportunityButton
                          projectId={project.id}
                          opportunityId={o.id}
                          title={o.title}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="space-y-2 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Add opportunities</p>
                <Button
                  size="sm"
                  render={
                    <Link
                      href={`/opportunities/manage/new?project=${project.id}`}
                    />
                  }
                  nativeButton={false}
                >
                  <Plus />
                  New opportunity
                </Button>
              </div>
              <ProjectAddOpportunity
                projectId={project.id}
                candidates={candidates}
              />
            </div>
          </div>
        </AppInfoCard>
      </div>
    </>
  );
}
