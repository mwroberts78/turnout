'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { Button } from '@/components/base-ui/button';
import { toast } from '@/components/base-ui/toast';
import { deleteProjectAction } from '@/lib/actions/project';

export function ProjectDeleteButton({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteProjectAction(projectId);

      if (!result.success) {
        toast.add({
          type: 'error',
          title: 'Could not delete project',
          description: result.message,
        });
        return;
      }

      toast.add({ type: 'success', title: 'Project deleted' });
      router.push('/projects/manage');
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 />
        Delete
      </Button>
      <AppConfirmDialog
        open={open}
        onOpenChange={setOpen}
        isPending={isPending}
        title="Delete project?"
        description={`"${title}" will be deleted. Its opportunities and their signups are kept; they just won't be grouped anymore.`}
        onConfirm={handleConfirm}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="destructive"
      />
    </>
  );
}
