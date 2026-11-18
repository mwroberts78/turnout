import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { AppDateRange } from '@/components/app-ui/app-date-range';
import { Card, CardContent } from '@/components/base-ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/base-ui/table';
import { findProjectsByTenant } from '@/lib/dal/project';
import { ProjectStatusBadge } from '../project-status-badge';

export async function ManageProjectsSection({
  tenantId,
}: {
  tenantId: string;
}) {
  const projects = await findProjectsByTenant(tenantId);

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <FolderKanban className="size-8 opacity-50" />
          No projects yet. Create one to group related opportunities.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Opportunities</TableHead>
            <TableHead>Dates</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="max-w-72 truncate font-medium">
                <Link
                  href={`/projects/manage/${project.id}`}
                  className="hover:underline"
                >
                  {project.title}
                </Link>
              </TableCell>
              <TableCell>
                <ProjectStatusBadge isPublished={project.isPublished} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {project.opportunityCount}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {project.firstStart && project.lastEnd ? (
                  <AppDateRange
                    start={project.firstStart}
                    end={project.lastEnd}
                  />
                ) : (
                  'No opportunities yet'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
