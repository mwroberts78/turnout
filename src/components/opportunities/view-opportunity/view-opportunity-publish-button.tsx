'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { useTableRefresh } from '@/components/app-ui/data-table/table-refresh-context';
import { Button } from '@/components/base-ui/button';
import { togglePublishOpportunityAction } from '@/lib/actions/opportunity';

export function ViewOpportunityPublishButton({
  opportunityId,
  isPublished,
}: {
  opportunityId: string;
  isPublished: boolean;
}) {
  const [publishOpen, setPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { refresh, isRefreshing } = useTableRefresh();

  async function handleConfirmPublish() {
    setIsPublishing(true);

    try {
      await togglePublishOpportunityAction(opportunityId);
      refresh();
      setPublishOpen(false);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setPublishOpen(true)}
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          isPublished ? (
            'Unpublishing...'
          ) : (
            'Publishing...'
          )
        ) : isPublished ? (
          <>
            <EyeOff /> Unpublish
          </>
        ) : (
          <>
            <Eye /> Publish
          </>
        )}
      </Button>
      <AppConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        isPending={isPublishing}
        title={`${isPublished ? 'Unpublish' : 'Publish'} opportunity`}
        description={
          isPublished
            ? 'Employees will no longer be able to see or sign up for this opportunity.'
            : 'This opportunity will become visible to employees for signup.'
        }
        onConfirm={handleConfirmPublish}
        confirmLabel={`${isPublished ? 'Unpublish' : 'Publish'}`}
        pendingLabel={`${isPublished ? 'Unpublishing...' : 'Publishing...'}`}
        variant="default"
      />
    </>
  );
}
