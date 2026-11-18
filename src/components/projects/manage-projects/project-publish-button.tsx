'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, useTransition } from 'react';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { Button } from '@/components/base-ui/button';
import { toast } from '@/components/base-ui/toast';
import { toggleProjectPublishAction } from '@/lib/actions/project';

export function ProjectPublishButton({
  projectId,
  isPublished,
}: {
  projectId: string;
  isPublished: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const verb = isPublished ? 'Unpublish' : 'Publish';

  function handleConfirm() {
    startTransition(async () => {
      const result = await toggleProjectPublishAction(projectId);

      if (!result.success) {
        toast.add({
          type: 'error',
          title: `Could not ${verb.toLowerCase()} project`,
          description: result.message,
        });
        return;
      }

      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {isPublished ? <EyeOff /> : <Eye />}
        {verb}
      </Button>
      <AppConfirmDialog
        open={open}
        onOpenChange={setOpen}
        isPending={isPending}
        title={`${verb} project`}
        description={
          isPublished
            ? 'Employees will no longer see this project. Its opportunities stay published and can still be found on their own.'
            : 'Employees will be able to browse this project and its published opportunities.'
        }
        onConfirm={handleConfirm}
        confirmLabel={verb}
        pendingLabel={isPublished ? 'Unpublishing...' : 'Publishing...'}
        variant="default"
      />
    </>
  );
}
