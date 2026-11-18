'use client';

import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/base-ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/base-ui/select';
import { toast } from '@/components/base-ui/toast';
import { addOpportunityToProjectAction } from '@/lib/actions/project';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function ProjectAddOpportunity({
  projectId,
  candidates,
}: {
  projectId: string;
  candidates: { id: string; title: string; startTime: Date }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Every opportunity already belongs to a project.
      </p>
    );
  }

  function handleAdd() {
    if (!selected) return;

    startTransition(async () => {
      const result = await addOpportunityToProjectAction(projectId, selected);

      if (!result.success) {
        toast.add({
          type: 'error',
          title: 'Could not add opportunity',
          description: result.message,
        });
        return;
      }

      setSelected(null);
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className="w-full sm:flex-1" aria-label="Opportunity">
          <SelectValue>
            {(value: string | null) =>
              candidates.find((c) => c.id === value)?.title ??
              'Choose an opportunity...'
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {candidates.map((candidate) => (
            <SelectItem key={candidate.id} value={candidate.id}>
              {candidate.title}
              <span className="text-muted-foreground">
                {' '}
                · {dateFormat.format(candidate.startTime)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAdd} disabled={!selected || isPending}>
        <Plus />
        {isPending ? 'Adding...' : 'Add to project'}
      </Button>
    </div>
  );
}
