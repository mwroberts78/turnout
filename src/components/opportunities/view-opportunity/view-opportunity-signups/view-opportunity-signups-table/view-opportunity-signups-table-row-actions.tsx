import { useState, useTransition } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { useTableRefresh } from '@/components/app-ui/data-table/table-refresh-context';
import { TableRowActionsMenu } from '@/components/app-ui/data-table/table-row-actions-menu';
import { Button } from '@/components/base-ui/button';
import { Field, FieldLabel } from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import { Separator } from '@/components/base-ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/base-ui/sheet';
import { Switch } from '@/components/base-ui/switch';
import { toast } from '@/components/base-ui/toast';
import { SignupReadOnlySummary } from '@/components/signups/signup-readonly-summary';
import { deleteSignUpAction, updateSignUpAction } from '@/lib/actions/signUp';
import type { signupEditFormSchema } from '@/lib/schemas/signup-edit-form';
import type { signupListItem } from '@/lib/schemas/signup-list-item';

export function ViewOpportunitySignupsTableRowActions({
  signup,
}: {
  signup: z.infer<typeof signupListItem>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const { refresh } = useTableRefresh();

  const form = useForm<z.input<typeof signupEditFormSchema>>({
    values: {
      workCompleted: signup.workCompleted,
      actualHours:
        signup.actualHours === null ? '' : String(signup.actualHours),
    },
  });

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

  function onSubmit(data: z.input<typeof signupEditFormSchema>) {
    startSaving(async () => {
      const result = await updateSignUpAction(
        signup.opportunityId,
        signup.id,
        data,
      );

      if (!result.success) {
        toast.add({
          type: 'error',
          title: 'Could not save signup',
          description: result.message,
        });
      }

      toast.add({ type: 'success', title: 'Signup updated' });
      refresh();
      setEditOpen(false);
    });
  }

  return (
    <>
      <TableRowActionsMenu
        items={[
          {
            label: 'Edit',
            onClick: () => setEditOpen(true),
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
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="bottom"
          className="rounded-md mx-auto max-w-5xl px-6 pb-6 mb-6"
        >
          <SheetHeader>
            <SheetTitle>Edit signup</SheetTitle>
            <SheetDescription>
              {signup.user.firstName} {signup.user.lastName}
            </SheetDescription>
          </SheetHeader>
          <SignupReadOnlySummary
            estimatedHours={signup.estimatedHours}
            wantsMeal={signup.wantsMeal}
            wantsTShirt={signup.wantsTShirt}
            tshirtSize={signup.tshirtSize}
            mealName={signup.selectedMealOption?.mealName ?? null}
            comments={signup.comments}
          />
          <Separator />
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field orientation="horizontal" className="max-w-sm">
              <FieldLabel htmlFor="workCompleted">Work completed</FieldLabel>
              <Controller
                control={form.control}
                name="workCompleted"
                render={({ field }) => (
                  <Switch
                    id="workCompleted"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="actualHours">Actual hours</FieldLabel>
              <Input
                id="actualHours"
                type="number"
                min={0}
                step="0.5"
                {...form.register('actualHours')}
                disabled={!form.getValues('workCompleted')}
              />
            </Field>
            <SheetFooter className="flex-row justify-end gap-2 px-0">
              <SheetClose
                render={
                  <Button type="button" variant="outline" disabled={isSaving} />
                }
              >
                Cancel
              </SheetClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
