import { useState } from 'react';
import { AppConfirmDeleteDialog } from '@/components/app-ui/app-confirm-delete-dialog';
import { useTableRefresh } from '@/components/app-ui/data-table/table-refresh-context';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions-menu';
import { deleteOpportunityAction } from '@/lib/actions/opportunity';

export function OpportunitiesTableRowActions({
  opportunity,
}: {
  opportunity: { id: string; title: string };
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useTableRefresh();

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await deleteOpportunityAction(opportunity.id);
      refresh();
      setDeleteOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }

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
        isDeleting={isDeleting}
        title="Delete opportunity?"
        description={`This will permanently delete "${opportunity.title}" and cannot be undone.`}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
