'use client';

import { Pencil, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { AppConfirmDialog } from '@/components/app-ui/app-confirm-dialog';
import { Button } from '@/components/base-ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/base-ui/sheet';
import { toast } from '@/components/base-ui/toast';
import { SignupForm } from '@/components/signups/signup-form';
import {
  cancelOwnSignUpAction,
  updateOwnSignUpAction,
} from '@/lib/actions/signUp';
import type { OwnSignUp } from '@/lib/dal/signUp';

export function MySignupActions({ signUp }: { signUp: OwnSignUp }) {
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, startCancelling] = useTransition();
  const { opportunity } = signUp;

  function handleConfirmCancel() {
    startCancelling(async () => {
      try {
        const result = await cancelOwnSignUpAction(signUp.id);

        if (!result.success) {
          toast.add({
            type: 'error',
            title: 'Could not cancel signup',
            description: result.message,
          });
          return;
        }

        toast.add({ type: 'success', title: 'Signup cancelled' });
        setCancelOpen(false);
      } catch {
        toast.add({
          type: 'error',
          title: 'Could not cancel signup',
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil />
        Edit
      </Button>
      <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
        <X />
        Cancel signup
      </Button>

      <AppConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        isPending={isCancelling}
        title="Cancel signup?"
        description={`You'll be removed from "${opportunity.title}" and your spot will open up for someone else.`}
        onConfirm={handleConfirmCancel}
        confirmLabel="Cancel signup"
        pendingLabel="Cancelling..."
        variant="destructive"
      />

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit signup</SheetTitle>
            <SheetDescription>{opportunity.title}</SheetDescription>
          </SheetHeader>
          {editOpen && (
            <SignupForm
              mealProvided={opportunity.mealProvided}
              tshirtProvided={opportunity.tshirtProvided}
              mealOptions={opportunity.mealOptions}
              defaultValues={{
                estimatedHours: String(signUp.estimatedHours),
                wantsMeal: signUp.wantsMeal,
                selectedMeal: signUp.selectedMeal,
                wantsTShirt: signUp.wantsTShirt,
                tshirtSize: signUp.tshirtSize,
                comments: signUp.comments ?? '',
              }}
              submitLabel="Save changes"
              pendingLabel="Saving..."
              className="space-y-4 px-4 pb-4"
              actions={
                <SheetClose render={<Button type="button" variant="outline" />}>
                  Close
                </SheetClose>
              }
              onSubmit={async (values) => {
                try {
                  const result = await updateOwnSignUpAction(signUp.id, values);

                  if (!result.success) {
                    toast.add({
                      type: 'error',
                      title: 'Could not save signup',
                      description: result.message,
                    });
                    return;
                  }

                  toast.add({ type: 'success', title: 'Signup updated' });
                  setEditOpen(false);
                } catch {
                  toast.add({
                    type: 'error',
                    title: 'Could not save signup',
                    description: 'Something went wrong. Please try again.',
                  });
                }
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
