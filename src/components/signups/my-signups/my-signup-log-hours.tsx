'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/base-ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/base-ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/base-ui/field';
import { Input } from '@/components/base-ui/input';
import { toast } from '@/components/base-ui/toast';
import { reportOwnHoursAction } from '@/lib/actions/signUp';
import type { OwnSignUp } from '@/lib/dal/signUp';
import { reportHoursFormSchema } from '@/lib/schemas/report-hours-form';

export function MySignupLogHours({ signUp }: { signUp: OwnSignUp }) {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();

  const form = useForm<
    z.input<typeof reportHoursFormSchema>,
    unknown,
    z.output<typeof reportHoursFormSchema>
  >({
    resolver: zodResolver(reportHoursFormSchema),
    values: {
      actualHours: String(signUp.actualHours ?? signUp.estimatedHours),
    },
  });

  function onSubmit() {
    startSaving(async () => {
      try {
        const result = await reportOwnHoursAction(signUp.id, form.getValues());

        if (!result.success) {
          toast.add({
            type: 'error',
            title: 'Could not log hours',
            description: result.message,
          });
          return;
        }

        toast.add({ type: 'success', title: 'Hours logged. Thank you!' });
        setOpen(false);
      } catch {
        toast.add({
          type: 'error',
          title: 'Could not log hours',
          description: 'Something went wrong. Please try again.',
        });
      }
    });
  }

  return (
    <>
      <Button
        variant={signUp.workCompleted ? 'outline' : 'default'}
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Clock />
        {signUp.workCompleted ? 'Edit hours' : 'Log hours'}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          if (isSaving) {
            eventDetails.cancel();
            return;
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Log your hours</DialogTitle>
              <DialogDescription>{signUp.opportunity.title}</DialogDescription>
            </DialogHeader>

            <Field>
              <FieldLabel htmlFor={`actualHours-${signUp.id}`}>
                Hours volunteered
              </FieldLabel>
              <Input
                id={`actualHours-${signUp.id}`}
                type="number"
                min={0.5}
                max={24}
                step="0.5"
                {...form.register('actualHours')}
                aria-invalid={!!form.formState.errors.actualHours}
              />
              <FieldDescription>
                This marks the opportunity completed and counts toward your
                total.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.actualHours]} />
            </Field>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={isSaving} />
                }
              >
                Cancel
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save hours'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
