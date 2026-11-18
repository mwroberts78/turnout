'use client';

import { X } from 'lucide-react';
import { useTransition } from 'react';
import { Button } from '@/components/base-ui/button';
import { toast } from '@/components/base-ui/toast';
import { removeOpportunityFromProjectAction } from '@/lib/actions/project';

export function ProjectRemoveOpportunityButton({
  projectId,
  opportunityId,
  title,
}: {
  projectId: string;
  opportunityId: string;
  title: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const result = await removeOpportunityFromProjectAction(
        projectId,
        opportunityId,
      );

      if (!result.success) {
        toast.add({
          type: 'error',
          title: 'Could not remove opportunity',
          description: result.message,
        });
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleRemove}
      disabled={isPending}
      aria-label={`Remove ${title} from project`}
    >
      <X />
    </Button>
  );
}
