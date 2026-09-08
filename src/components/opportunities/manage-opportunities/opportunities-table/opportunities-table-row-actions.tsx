import { useState } from 'react';
import { AppConfirmDeleteDialog } from '@/components/app-ui/app-confirm-delete-dialog';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions-menu';

export function OpportunitiesTableRowActions({
  opportunity,
}: {
  opportunity: { id: string; title: string };
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <TableRowActionsMenu
        items={[
          {
            href: `/opportunities/manage/${opportunity.id}`,
            label: 'View details',
          },
          {
            label: 'Edit',
            href: `/opportunities/manage/${opportunity.id}/edit`,
          },
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />
      <AppConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete opportunity?"
        description={`This will permanently delete "${opportunity.title}" and cannot be undone.`}
        onConfirm={async () => {
          //TODO: call the actual delete when it exists
        }}
      />
    </>
  );
}
