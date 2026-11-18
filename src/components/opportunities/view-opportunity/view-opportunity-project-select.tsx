'use client';

import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import { toast } from '@/components/base-ui/toast';
import { moveOpportunityToProjectAction } from '@/lib/actions/project';

export function ViewOpportunityProjectSelect({
  opportunityId,
  projectId,
  projects,
}: {
  opportunityId: string;
  projectId: string | null;
  projects: { id: string; title: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(nextProjectId: string | null) {
    if (nextProjectId === projectId) return;

    startTransition(async () => {
      const result = await moveOpportunityToProjectAction(
        opportunityId,
        nextProjectId,
      );

      if (!result.success) {
        toast.add({
          type: 'error',
          title: 'Could not change project',
          description: result.message,
        });
        return;
      }

      toast.add({
        type: 'success',
        title: nextProjectId ? 'Project updated' : 'Removed from project',
      });
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-2">
        <FolderKanban className="text-muted-foreground size-4" />
        Project
        {projectId && (
          <Link
            href={`/projects/manage/${projectId}`}
            className="text-xs text-primary hover:underline"
          >
            View
          </Link>
        )}
      </span>
      <Select value={projectId} onValueChange={handleChange}>
        <SelectTrigger
          className="ml-6 w-auto"
          aria-label="Project"
          disabled={isPending}
        >
          <SelectValue>
            {(value: string | null) =>
              projects.find((p) => p.id === value)?.title ?? 'No project'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>No project</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
