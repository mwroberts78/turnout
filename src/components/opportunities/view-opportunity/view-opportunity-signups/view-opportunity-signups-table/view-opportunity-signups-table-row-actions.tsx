import { useState } from 'react';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { useTableRefresh } from '@/components/app-ui/data-table/table-refresh-context';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions-menu';
import { deleteSignUpAction } from '@/lib/actions/signUp';

export function ViewOpportunitySignupsTableRowActions({
  signup,
}: {
  signup: {
    id: string;
    opportunityId: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { refresh } = useTableRefresh();

  async function handleConfirmDelete() {
    setIsDeleting(true);

    try {
      await deleteSignUpAction(signup.opportunityId, signup.id);
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
            href: `/opportunities/manage/${signup.opportunityId}/signup/${signup.id}`,
            label: 'View details',
          },
          {
            label: 'Edit',
            href: `/opportunities/manage/${signup.opportunityId}/signup/${signup.id}/edit`,
          },
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />
      <AppConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isPending={isDeleting}
        title="Delete opportunity?"
        description={`This will permanently delete the signup for "${signup.user.firstName} ${signup.user.lastName}" and cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        variant="destructive"
      />
    </>
  );
}
