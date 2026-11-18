import { CalendarRange, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { AppDateRange } from '@/components/app-ui/app-date-range';
import { Card, CardContent } from '@/components/base-ui/card';
import type { PublishedProject } from '@/lib/dal/project';

export function BrowseProjectCard({ project }: { project: PublishedProject }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-shadow group-hover:shadow-lg">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <FolderKanban className="size-5" />
            </div>
            <h3 className="min-w-0 flex-1 font-semibold">{project.title}</h3>
          </div>
          {project.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
            <span>
              {project.upcomingCount}{' '}
              {project.upcomingCount === 1 ? 'opportunity' : 'opportunities'}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarRange className="size-3.5" />
              <AppDateRange start={project.nextStart} end={project.lastEnd} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
